import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image, params } = req.body;

    // 1. Lưu ảnh tạm thời
    const tempImagePath = path.join(process.cwd(), 'temp', 'input.png');
    const imageBuffer = Buffer.from(image, 'base64');
    fs.writeFileSync(tempImagePath, imageBuffer);

    // 2. Chạy script Python
    const pythonProcess = spawn('python', [
      'transform_script.py',
      tempImagePath,
      JSON.stringify(params)
    ]);

    // 3. Nhận kết quả từ Python
    let result = '';
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}`));
        } else {
          resolve(result);
        }
      });
    });

    // 4. Đọc ảnh kết quả và gửi về client
    const outputImagePath = path.join(process.cwd(), 'temp', 'output.png');
    const outputImage = fs.readFileSync(outputImagePath);
    const base64Image = outputImage.toString('base64');

    // 5. Xóa files tạm
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(outputImagePath);

    res.status(200).json({ transformed_image: base64Image });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 