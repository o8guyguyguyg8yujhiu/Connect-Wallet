import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Полифил для Buffer, добавлен в глобальный объект
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

// Лог для проверки корректной работы Buffer
console.log("Buffer test:", Buffer.from("test").toString());

// Рендер приложения
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
