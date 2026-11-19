import { useEffect } from "react";

export function useSEO({ title, description }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Nexora`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDescription = metaDesc ? metaDesc.getAttribute("content") : "";

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDescription) {
        metaDesc.setAttribute("content", prevDescription);
      }
    };
  }, [title, description]);
}
