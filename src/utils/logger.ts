export const logInfo = (message: string, data?: unknown) => {
    console.log(`${new Date().toISOString()} - INFO: ${message}`, data || "");
  };
  
  export const logError = (message: string, error?: unknown) => {
    console.error(`${new Date().toISOString()} - ERROR: ${message}`, error || "");
  };