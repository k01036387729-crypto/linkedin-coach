const GOOGLE_SHEET_API_URL = process.env.GOOGLE_SHEET_API_URL;

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: "Method Not Allowed" 
    };
  }

  // 필수 환경 변수 확인 (Netlify 설정 오류 방지)
  if (!GOOGLE_SHEET_API_URL) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: "Server configuration error: GOOGLE_SHEET_API_URL is missing." 
      }) 
    };
  }

  try {
    const studentSubmission = JSON.parse(event.body);

    // Google Sheets Apps Script API에 데이터 전송
    const sheetResponse = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentSubmission)
    });

    if (!sheetResponse.ok) {
      // Sheets API에서 오류가 발생한 경우
      throw new Error(`Google Sheets API error: ${sheetResponse.status}`);
    }

    const result = await sheetResponse.json();

    // Google Sheets에서 받은 응답을 클라이언트에게 전달
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error("Error processing submission:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to process submission", 
        details: error.message 
      }),
    };
  }
};
