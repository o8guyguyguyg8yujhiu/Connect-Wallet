import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Импорт полифила для Buffer
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

// Тестовый вывод для проверки доступа к Buffer
console.log(Buffer.from("test")); // Если работает, то проблема решена

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
