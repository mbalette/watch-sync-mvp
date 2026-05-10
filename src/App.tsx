import "./App.css";
import { isDemoId } from "./reference-screens-ids";
import { ReferenceScreen } from "./reference-screens";
import { AppFlow } from "./AppFlow";

function App() {
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  if (isDemoId(demoParam)) {
    return <ReferenceScreen id={demoParam} />;
  }
  return <AppFlow />;
}

export default App;
