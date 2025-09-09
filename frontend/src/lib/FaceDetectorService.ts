import cvReadyPromise from "@techstark/opencv-js";

export type RectVector = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const detectFacePositions = async (
  bitmap: ImageBitmap
): Promise<RectVector[]> => {
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const cv = await cvReadyPromise;
  const file = await fetch("/cascades/lbpcascade_animeface.xml");
  const arrayBuffer = new Uint8Array(await file.arrayBuffer());
  try {
    cv.FS_createDataFile(
      "/",
      "lbpcascade_animeface.xml",
      arrayBuffer,
      true,
      false,
      false
    );
  } catch {
    // file already exists
  }
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const faces = new cv.RectVector();
  const classifier = new cv.CascadeClassifier();
  classifier.load("lbpcascade_animeface.xml");
  classifier.detectMultiScale(gray, faces);

  const results: RectVector[] = [];
  for (let i = 0; i < faces.size(); i++) {
    const face = faces.get(i);
    results.push({
      x: face.x,
      y: face.y,
      width: face.width,
      height: face.height,
    });
  }

  faces.delete();
  src.delete();
  gray.delete();
  classifier.delete();

  return results;
};
