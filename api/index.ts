import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index';

// Express app을 Vercel 서버리스 함수로 변환
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Express app의 요청 핸들러를 직접 호출
  return new Promise((resolve, reject) => {
    app(req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
} 