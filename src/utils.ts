const corsHeaders = {
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Origin": "*"
};

export const createResponse = (body: any, statusCode: number = 200) => {
  return {
    statusCode: statusCode,
    headers: {
      ...corsHeaders
    },
    body: JSON.stringify(body)
  }
};
