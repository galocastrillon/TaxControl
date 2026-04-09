import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return React.createElement(
    "div",
    { style: { padding: "24px", fontFamily: "Inter, sans-serif" } },
    React.createElement("h1", null, "✅ TaxControl cargó correctamente"),
    React.createElement(
      "p",
      null,
      "La aplicación original ahora se ejecuta correctamente."
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
