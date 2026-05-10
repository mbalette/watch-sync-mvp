import "./App.css";
import { isDemoId } from "./reference-screens-ids";
import { ReferenceScreen } from "./reference-screens";
import { AppFlow } from "./AppFlow";
import LiveRoomApp from "./LiveRoomApp";
import { selectAppSurface } from "./app-surface";

function App() {
  const params = new URLSearchParams(window.location.search);
  const demoParam = params.get("demo");
  const surface = selectAppSurface(params);
  if (surface === "reference" && isDemoId(demoParam)) {
    return <ReferenceScreen id={demoParam} />;
  }
  if (surface === "flow") {
    return <AppFlow />;
  }
  return <LiveRoomApp />;
}

export default App;
