import express from "express";
import { trace, Span, SpanStatusCode } from "@opentelemetry/api";

const router = express.Router();
const tracer = trace.getTracer("my-tracer");

router.get("/logging", (req, res) => {
  // Create a span for demo purposes
  tracer.startActiveSpan("demo-span", (span: Span) => {
    // Add an event to the span
    span.addEvent("test-event", {
      message: "This is a test event",
    });

    // Set an attribute on the span
    span.setAttribute("my-attribute", "my-value");

    // End the span
    span.end();

    // Send a response
    res.send("Hello World");
  });
});

router.get("/exception", (req, res) => {
  tracer.startActiveSpan("demo-span", (span: Span) => {
    try {
      // Throw an error for demo purposes
      throw new Error("This is a test error");
    } catch (error: any) {
      // Record the error
      span.recordException({ code: "TEST-ERROR", message: error.message });

      // Set the status to error
      span.setStatus({ code: SpanStatusCode.ERROR });

      // Re-throw the error
      throw error;
    } finally {
      // End the span
      span.end();
    }
  });
});

export default router;
