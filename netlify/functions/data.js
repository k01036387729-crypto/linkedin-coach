const GOOGLE_SHEET_API_URL = process.env.GOOGLE_SHEET_API_URL; 

exports.handler = async (event, context) => {
    // 필수 환경 변수 확인 (Netlify 설정 오류 방지)
    if (!GOOGLE_SHEET_API_URL) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error: GOOGLE_SHEET_API_URL is missing." }) };
    }

    try {
        // Google Sheets Apps Script API에 GET 요청 (모든 기록 로드)
        const sheetResponse = await fetch(GOOGLE_SHEET_API_URL);

        if (!sheetResponse.ok) {
            throw new Error(`Google Sheets API error: ${sheetResponse.status}`);
        }
        
        // 시트에서 가져온 원본 데이터 (모든 행)
        const allRecords = await sheetResponse.json(); 

        // 🚨 시트 기록을 학생별, 단계별 최고 점수 형태로 재구성 🚨
        const organizedData = {};

        allRecords.forEach(record => {
            const studentId = record.StudentID;
            
            // 학생별 초기화
            if (!organizedData[studentId]) {
                organizedData[studentId] = {
                    studentId: studentId,
                    studentName: record.StudentName,
                    submissions: [],
                    // scoresByStep: { 1: 0, 2: 0, 3: 0, 4: 0 } // 4단계별 최고 점수는 대시보드 JS에서 계산하도록 submissions만 저장
                };
            }
            
            // 시트에서 가져온 제출 기록 추가 (각 제출은 하나의 레코드)
            // 시트의 Step, Score 컬럼을 사용하여 기록을 구성합니다.
            organizedData[studentId].submissions.push({
                step: parseInt(record.Step), // 숫자로 변환
                score: parseInt(record.Score), // 숫자로 변환
                timestamp: record.Timestamp,
                data: {} // Sheets에 저장되지 않은 data 필드는 빈 객체로 둡니다.
            });
        });
        
        // 최종적으로 교사 대시보드가 요구하는 형식에 맞게 재구성
        const finalDashboardData = {};
        Object.values(organizedData).forEach(student => {
            finalDashboardData[student.studentId] = {
                studentId: student.studentId,
                studentName: student.studentName,
                // submissions 배열을 timestamp 기준 내림차순 정렬 (최신 기록이 먼저 오도록)
                submissions: student.submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            };
        });


        // 교사에게 데이터를 JSON 형태로 반환합니다.
        return {
            statusCode: 200,
            body: JSON.stringify(finalDashboardData),
            headers: {
                'Access-Control-Allow-Origin': '*' // CORS 허용
            }
        };

    } catch (error) {
        console.error("Error fetching data:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch student data", details: error.message }),
        };
    }
};