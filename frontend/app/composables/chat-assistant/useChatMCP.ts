/**
 * Composable для работы с MCP инструментами
 */

export interface MCPToolCallResult {
  success: boolean
  error?: string
  tool?: string
  timestamp?: string
  [key: string]: any
}

export function useChatMCP() {
  // Функция для вызова MCP инструментов
  const callMCPTool = async (toolName: string, arguments_: any): Promise<MCPToolCallResult> => {
    try {
      const response = await fetch('/api/mcp/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: arguments_
          },
          id: Date.now().toString()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`MCP API error ${response.status}:`, errorText)
        throw new Error(`MCP API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        console.error(`MCP tool ${toolName} error:`, data.error)
        throw new Error(data.error.message || `MCP tool ${toolName} error`)
      }
      
      if (!data.result) {
        console.warn(`MCP tool ${toolName} returned empty result:`, data)
        throw new Error(`MCP tool ${toolName} returned empty result`)
      }
      
      console.log(`MCP tool ${toolName} result:`, JSON.stringify(data.result, null, 2))
      return data.result
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error)
      
      // Возвращаем структурированную ошибку вместо выбрасывания
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown MCP error',
        tool: toolName,
        timestamp: new Date().toISOString()
      }
    }
  }

  return {
    callMCPTool
  }
}

export type UseChatMCPReturn = ReturnType<typeof useChatMCP>