// Ported verbatim from PortMasters2/PortMasters_online.html (lines 1186-1188): three fixed,
// blurred, slowly drifting light patches behind everything (z-index: -1), present on every
// screen. Styled entirely by .bg-orb / .orb-1/2/3 in global.css.
export function BgOrbs() {
  return (
    <>
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />
    </>
  );
}
