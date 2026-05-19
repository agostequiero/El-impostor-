export const firebaseConfig = {
  apiKey: "AIzaSyB8eRbkeyE0w0wLl10QVSa0JDKU_t49Hko",
  authDomain: "el-impostorr.firebaseapp.com",
  databaseURL: "https://el-impostorr-default-rtdb.firebaseio.com",
  projectId: "el-impostorr",
  storageBucket: "el-impostorr.firebasestorage.app",
  messagingSenderId: "949215994691",
  appId: "1:949215994691:web:a9b41638ad01f4142345f6"
};

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}
