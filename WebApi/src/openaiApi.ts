/**
 * OpenAI API integration module for processing chat completions
 * Uses Azure OpenAI service with OpenTelemetry tracing
 */
import { AzureOpenAI } from "openai";
import { ResponseFunctionToolCall, ResponseInputItem } from "openai/resources/responses/responses.mjs";
import express from "express";
import { Span, SpanStatusCode, trace } from "@opentelemetry/api";

import prompt from "./prompt.js";
import * as functions from "./functions.js";
import Database from "./sql.js";
import KeyVault from "./keyvault.js";

// OpenTelemetry for tracing OpenAI operations
const tracer = trace.getTracer("openai");

const deployment = "gpt-4o";
const apiVersion = "2025-03-01-preview";
let openaiClient: AzureOpenAI | undefined;

/**
 * Creates and configures an Express router for OpenAI API operations
 * Handles chat completions with function calling capabilities
 * @param db Database instance for cart operations
 * @param keyVault KeyVault instance for retrieving API credentials
 * @returns Configured Express router for OpenAI endpoints
 */
export default function getOpenaiApi(db: Database, keyVault: KeyVault) {
  const router = express.Router();

  /**
   * POST endpoint for chat completions
   * Processes user input, handles function calls, and returns AI responses
   */
  router.post("/chat", async (req, res) => {
    return await tracer.startActiveSpan("chat-request", async (span: Span) => {
      try {
        // Initialize OpenAI client if not already done
        if (!openaiClient) {
          const openaiApiKey = await keyVault.getSecret("AZURE-OPENAI-API-KEY");
          if (!openaiApiKey) {
            throw new Error("OpenAI API key not found");
          }

          openaiClient = new AzureOpenAI({
            apiKey: openaiApiKey,
            deployment,
            apiVersion,
          });
        }

        const { cartId, input, previousId }: { cartId: string; input: string; previousId?: string } = req.body;
        if (!cartId) {
          res.status(400).send({ error: "Cart ID is required" });
          return;
        }

        if (!input) {
          res.status(400).send({ error: "Input is required" });
          return;
        }

        // Create initial response with user input and available tools
        let response = await openaiClient.responses.create({
          model: "gpt-4o",
          max_output_tokens: 4096,
          input: input,
          instructions: prompt,
          previous_response_id: previousId,
          tools: functions.functions,
        });

        // Continue processing function calls until none remain
        while (response.output.filter((item) => item.type === "function_call").length > 0) {
          const toolOutput: ResponseInputItem.FunctionCallOutput[] = [];

          await tracer.startActiveSpan("tool_calls", {}, async (toolsSpan: Span) => {
            try {
              for (const toolCall of response.output) {
                if (toolCall.type !== "function_call") {
                  continue;
                }

                const output = await processToolCall(toolCall, db, cartId);
                toolOutput.push({
                  type: "function_call_output",
                  call_id: toolCall.call_id!,
                  output: JSON.stringify(output),
                });
              }
            } catch (exception: any) {
              toolsSpan.recordException(exception.message ?? "");
              toolsSpan.setStatus({ code: SpanStatusCode.ERROR });
              throw exception;
            } finally {
              toolsSpan.end();
            }
          });

          // Continue conversation with function outputs
          response = await openaiClient.responses.create({
            model: "gpt-4o",
            max_output_tokens: 4096,
            input: toolOutput,
            instructions: prompt,
            previous_response_id: response.id,
            tools: functions.functions,
          });
        }

        // Return final AI response to the client
        res.send({
          id: response.id,
          output: response.output_text,
        });
      } catch (error: any) {
        span.recordException(error.message ?? "");
        span.setStatus({ code: SpanStatusCode.ERROR });
        res.status(500).send({ error: "Failed to process request" });
      } finally {
        span.end();
      }
    });
  });

  return router;
}

/**
 * Processes a single function call from the OpenAI response
 * Maps function calls to the appropriate handlers in the functions module
 * @param toolCall Function call object from OpenAI response
 * @param db Database instance for cart operations
 * @param cartId Current cart identifier
 * @returns Result of the function execution
 */
async function processToolCall(toolCall: ResponseFunctionToolCall, db: Database, cartId: string) {
  let output: unknown;
  switch (toolCall.name) {
    case functions.getCartItemsFunctionDefinition.name:
      output = await functions.getCartItems(db, cartId);
      break;
    case functions.addCartItemFunctionDefinition.name:
      output = await functions.addCartItem(db, cartId, JSON.parse(toolCall.arguments));
      break;
    case functions.deleteCartItemFunctionDefinition.name:
      await functions.deleteCartItem(db, JSON.parse(toolCall.arguments));
      output = "Cart item deleted";
      break;
    case functions.clearCartFunctionDefinition.name:
      await functions.clearCart(db, cartId);
      output = "Cart cleared";
      break;
  }
  return output;
}
