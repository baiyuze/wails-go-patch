import { Route, Routes, HashRouter } from "react-router-dom";
import Home from "./views/Home/Home";
import Result from "./views/Result/Result";
import Upload from "./views/Upload/Upload";

function Router() {
  return (
    <HashRouter basename={"/"}>
      <Routes>
        <Route path="/" Component={Home} />
        <Route path="/result" Component={Result} />
        <Route path="/upload" Component={Upload} />
      </Routes>
    </HashRouter>
  );
}

export default Router;
