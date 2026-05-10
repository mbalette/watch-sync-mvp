import "./App.css";
import { isDemoId } from "./reference-screens-ids";
import { ReferenceScreen } from "./reference-screens";
import { AppFlow } from "./AppFlow";
import LiveRoomApp from "./LiveRoomApp";

function App() {
  const params = new URLSearchParams(window.location.search);
  const demoParam = params.get("demo");
  if (isDemoId(demoParam)) {
    return <ReferenceScreen id={demoParam} />;
  }
  if (params.get("visual") === "1") {
    return <AppFlow />;
  }
  return <LiveRoomApp />;
}

export default App;
