import React, { Component } from "react";
import Welcome from "./Welcome";
import Help from "./Help";
import WritingApp from "./App";
import { AppShell, HistoryPage, SettingsPage } from "./Workspace";

import {
  createBrowserRouter,
  RouterProvider,
  useSearchParams,
} from "react-router-dom";

const App = (props) => {
  let [searchParams] = useSearchParams();
  let parse = (p) => {
    if (typeof p !== "string") return null;
    switch (p.toLowerCase()) {
      case "true":
        return true;
      case "1":
        return true;
      case "false":
        return false;
      case "0":
        return false;
      default:
        return null;
    }
  };

  let appProps = {
    limit: parseInt(searchParams.get("limit"), 10) || 5,
    type: searchParams.get("type") || "minutes",
    hardcore: parse(searchParams.get("hardcore")),
    nightmode: parse(searchParams.get("nightmode")),
    morning: searchParams.get("morning") === "true",
  };
  // Setting a random key forces the component to re-mount even if
  // the route didn't change. That's useful for when we click the
  // Write button from withing <WritingApp />
  return <WritingApp key={Math.random()} {...appProps} />;
};

const githubPagesBase =
  typeof window !== "undefined" && window.location.hostname === "maebert.github.io"
    ? "/themostdangerouswritingapp"
    : undefined;

const router = createBrowserRouter(
  [
    { path: "/", element: <AppShell><Welcome /></AppShell> },
    { path: "/write", element: <AppShell><App /></AppShell> },
    { path: "/morning-pages", element: <AppShell><HistoryPage morning /></AppShell> },
    { path: "/sessions", element: <AppShell><HistoryPage /></AppShell> },
    { path: "/settings", element: <AppShell><SettingsPage /></AppShell> },
    { path: "/help", element: <Help /> },
  ],
  { basename: githubPagesBase }
);

export default class MDWA extends Component {
  render() {
    return <RouterProvider router={router} />;
  }
}
