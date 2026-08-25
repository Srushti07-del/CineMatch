
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { RoomProvider } from "./lib/RoomContext";

  createRoot(document.getElementById("root")!).render(
    <RoomProvider>
      <App />
    </RoomProvider>
  );
