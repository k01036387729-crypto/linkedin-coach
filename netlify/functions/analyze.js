exports.handler = async (event, context) => {
  // CORS (Cross-Origin Resource Sharing) 처리를 위한 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Anthropic-Version, POST, OPTIONS',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'CORS preflight successful',
    };
  }

  // POST 요청만 처리
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'method not allowed' }),
    };
  }

  try {
    // 1. 클라이언트 요청 본문 파싱
    const { briefData, systemPrompt, userPrompt } = JSON.parse(event.body);

    // --- 디버깅 시작 ---
    // 환경 변수가 제대로 로드되었는지 확인 (true/false)
    console.log("DEBUG: ANTHROPIC_API_KEY loaded:", !!process.env.ANTHROPIC_API_KEY);
    // 프롬프트 데이터 확인
    console.log("DEBUG: Received userPrompt length:", userPrompt.length);
    // --- 디버깅 끝 ---

    // 2. Anthropic API 호출을 위한 요청 본문 구성
    const apiBody = JSON.stringify({
      model: 'claude-3-5-sonnet',
      max_tokens: 4096,
      temperature: 0.2,
      system: systemPrompt, // 시스템 프롬프트 추가
      messages: [{
        role: 'user',
        content: userPrompt, // 사용자 프롬프트
      }],
    });

    // 3. Anthropic API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01', // API 버전 명시 (필수)
      },
      body: apiBody,
    });

    // 4. API 응답 처리
    // --- 디버깅 추가: API 응답 상태 코드 확인 ---
    console.log(`DEBUG: Anthropic API Response Status: ${response.status}`);
    // --- 디버깅 끝 ---

    const responseData = await response.json();

    // 5. 응답 상태 코드가 200번대가 아니면 에러를 반환
    if (!response.ok) {
        // --- 디버깅 추가: API가 반환한 오류 내용 전체 로깅 ---
        console.error("DEBUG: Anthropic API Error Details:", responseData);
        // --- 디버깅 끝 ---

        return {
            statusCode: response.status, // API가 반환한 에러 코드 그대로 사용
            headers,
            body: JSON.stringify({ 
                error: 'External API Error',
                details: responseData 
            }),
        };
    }

    // 6. 성공적인 응답 반환
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    // 7. 로컬 파싱 오류 또는 예상치 못한 오류 처리
    console.error("Function execution error:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
};