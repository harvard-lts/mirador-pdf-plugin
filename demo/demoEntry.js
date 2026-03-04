import Mirador from "mirador/dist/es/src/index";
import Plugin from "../src/index";

document.addEventListener("DOMContentLoaded", () => {
  const config = {
    id: "mirador",
    windows: [
      {
        manifestId: "https://nrs-dev.lib.harvard.edu/URN-3:RAD.SCHL:101118966:MANIFEST:3"
      }
    ],
    miradorPdfPlugin: {
      pdfAPI:'http://mps-dev.lib.harvard.edu/pdf/download/',
    },
  };

  const plugins = [...Plugin];

  Mirador.viewer(config, plugins);
});
