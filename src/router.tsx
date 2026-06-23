import { createBrowserRouter } from "react-router-dom";
import Root from "./features/Root";
import { EntityPage } from "./features/entity/EntityPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <EntityPage />,
      },
    ],
  },
]);
