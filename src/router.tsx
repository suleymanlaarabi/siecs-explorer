import { createBrowserRouter } from "react-router-dom";
import Root from "./features/Root";
import { WorldEditorPage } from "./features/world/WorldEditorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <WorldEditorPage />,
      },
    ],
  },
]);
