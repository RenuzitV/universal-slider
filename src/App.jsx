import { useState } from "react";
import Slider from "./slider.jsx";

export default function App() {
  const [value, setValue] = useState(50);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", padding: 40 }}>
      <h1>Enter your birthday</h1>
      <Slider min={0} max={100} value={value} onChange={setValue} />
      <div style={{ marginTop: 30, fontSize: 20 }}>Value: {value}</div>
    </div>
  );
}
