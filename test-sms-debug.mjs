// 알리고 SMS API 테스트 스크립트
import aligoapi from 'aligoapi';
import fs from 'fs';

// 로그 저장 함수
function logToFile(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync('server.log', logMessage);
}

// 알리고 인증 정보
const AuthData = {
  key: 'dq1i78m9124pyk1zhoemysiba486zz11', // 발급키
  user_id: 'gihan16', // 사용자 아이디
  testmode_yn: 'Y' // 테스트 모드 사용
};

// SMS 요청 객체
const req = {
  body: {
    sender: '01045525994', // 발신번호 (인증된 번호여야 함)
    receiver: '01045525994', // 수신번호
    msg: '[테스트] 숲체험 예약알림 문자 발송 테스트입니다.',
    msg_type: 'SMS' // SMS(단문)
  },
  headers: {}
};

async function testSms() {
  logToFile('SMS 발송 테스트를 시작합니다...');
  logToFile(`인증 정보: ${JSON.stringify(AuthData)}`);
  logToFile(`요청 데이터: ${JSON.stringify(req.body)}`);
  
  try {
    logToFile('SMS API 호출 중...');
    const result = await aligoapi.send(req, AuthData);
    logToFile(`SMS 발송 결과: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logToFile(`SMS 발송 실패: ${error.message}`);
    logToFile(error.stack);
    throw error;
  }
}

// 테스트 실행
testSms()
  .then(() => logToFile('테스트가 완료되었습니다.'))
  .catch(() => logToFile('테스트 중 오류가 발생했습니다.')); 