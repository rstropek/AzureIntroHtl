/**
 * Azure Key Vault integration module for secure secret management
 * Provides access to application secrets using Azure Entra ID authentication
 */
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * KeyVault class for retrieving secrets from Azure Key Vault
 * Uses Azure Entra ID Default authentication via managed identity or developer credentials
 */
export default class KeyVault {
    /**
     * URL of the Azure Key Vault instance
     * This should match the Key Vault deployed in your Azure subscription
     */
    private static vaultUrl = "https://kvazureintrohtl.vault.azure.net";

    /**
     * Azure Key Vault Secret Client instance
     * Handles authentication and communication with the Key Vault service
     */
    private client: SecretClient;

    /**
     * Initializes a new KeyVault instance
     * Sets up authentication using DefaultAzureCredential which tries multiple auth methods
     */
    constructor() {
        const credential = new DefaultAzureCredential();
        this.client = new SecretClient(KeyVault.vaultUrl, credential);
    }

    /**
     * Retrieves a secret value from Azure Key Vault by name
     * @param secretName Name of the secret to retrieve
     * @returns The secret value or undefined if not found
     */
    async getSecret(secretName: string): Promise<string | undefined> {
        const secret = await this.client.getSecret(secretName);
        return secret.value;
    }
}