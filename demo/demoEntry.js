import Mirador from "mirador/dist/es/src/index";
import Plugin from "../src/index";

document.addEventListener("DOMContentLoaded", () => {
  const config = {
    id: "mirador",
    windows: [
      {
        manifestId: "https://nrs.lib.harvard.edu/URN-3:FHCL.LOEB:25853480:MANIFEST:3"
      }
    ],
    miradorPdfPlugin: {
      pdfAPI:'http://mps.lib.harvard.edu/pdf/download/',
    },
  };

  const plugins = [...Plugin];

  Mirador.viewer(config, plugins);
});
