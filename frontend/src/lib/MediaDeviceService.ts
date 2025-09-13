export const ensureCameraAccess = async (): Promise<void> => {
  const permission = await navigator.permissions.query({ name: "camera" });
  switch (permission.state) {
    case "granted":
      break;
    case "prompt":
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        ensureCameraAccess();
      } catch {
        throw new Error("カメラへのアクセス権限がブラウザで拒否されています");
      }
      break;
    case "denied":
      throw new Error("カメラへのアクセス権限がブラウザで拒否されています");
  }
};

export const fetchVirtualCameraId = async (): Promise<string> => {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();

  const device = mediaDevices
    .filter((device) => device.kind === "videoinput")
    .find((device) => device.label === "OBS Virtual Camera");
  if (!device) {
    throw new Error("OBS Studio の仮想カメラを検出できませんでした");
  }
  return device.deviceId;
};

export const fetchMediaStream = async (
  deviceId: string
): Promise<MediaStream> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
  });
  return stream;
};
