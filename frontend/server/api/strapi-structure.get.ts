import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const strapiUrl = config.strapi.url
  const strapiAdminToken = config.strapiAdmin.token
  
  if (!strapiUrl || !strapiAdminToken) {
    throw createError({
      statusCode: 500,
      message: 'Strapi URL or admin token not configured'
    })
  }
  
  try {
    // Получаем Content Types через Admin API (Strapi v5)
    const contentTypesResponse = await $fetch(`${strapiUrl}/api/content-type-builder/content-types`, {
      headers: {
        'Authorization': `Bearer ${strapiAdminToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Получаем Components через Admin API (Strapi v5)
    const componentsResponse = await $fetch(`${strapiUrl}/api/content-type-builder/components`, {
      headers: {
        'Authorization': `Bearer ${strapiAdminToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    return {
      contentTypes: contentTypesResponse,
      components: componentsResponse
    }
  } catch (error: any) {
    consola.error('Error fetching Strapi structure:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to fetch Strapi structure'
    })
  }
})