type RoomWorld2DProps = {
  isStalkerVisible: boolean;
  isCorridorOpen: boolean;
  isFlashlightActive: boolean;
  isFlashlightFlickering: boolean;
};

const frontRooms = [-34, -22, -10, 2, 14, 26, 38];
const sideRooms = [24, 38, 52];
const trashProps = [
  ['motel-trash', 32, 62],
  ['motel-trash motel-trash-wide', 58, 58],
  ['motel-suitcase', 28, 48],
  ['motel-suitcase motel-suitcase-open', 68, 67],
  ['motel-branch', 43, 72],
  ['motel-branch motel-branch-long', 76, 50],
];

function RoomDoor({ x, broken }: { x: number; broken: boolean }) {
  return <span className={broken ? 'motel-2d-door motel-2d-door-broken' : 'motel-2d-door'} style={{ left: `${50 + x}%` }} />;
}

function RoomWindow({ x, boarded }: { x: number; boarded: boolean }) {
  return (
    <span className={boarded ? 'motel-2d-window motel-2d-window-boarded' : 'motel-2d-window motel-2d-window-broken'} style={{ left: `${50 + x}%` }}>
      <i />
      <b />
    </span>
  );
}

function SideRooms({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`motel-2d-side motel-2d-side-${side}`}>
      {sideRooms.map((top, index) => (
        <span className="motel-2d-side-door" key={`${side}-${top}`} style={{ top: `${top}%` }}>
          <i className={index === 1 ? 'motel-2d-window-boarded' : 'motel-2d-window-broken'} />
        </span>
      ))}
    </div>
  );
}

function BurntCar({ x, y, turn }: { x: number; y: number; turn: number }) {
  return (
    <div className="motel-2d-car" style={{ left: `${x}%`, top: `${y}%`, rotate: `${turn}deg` }}>
      <span />
      <i />
      <b />
    </div>
  );
}

export function RoomWorld2D({
  isCorridorOpen,
  isFlashlightActive,
  isFlashlightFlickering,
  isStalkerVisible,
}: RoomWorld2DProps) {
  return (
    <div
      className={[
        'motel-2d-world',
        isFlashlightActive ? 'motel-2d-lit' : 'motel-2d-dark',
        isFlashlightFlickering ? 'motel-2d-flicker' : '',
        isCorridorOpen ? 'motel-2d-corridor-open' : '',
      ].join(' ')}
    >
      <div className="motel-2d-asphalt" />
      <div className="motel-2d-sign">
        <span>MOTEL</span>
      </div>
      <div className="motel-2d-building motel-2d-front">
        {frontRooms.map((x, index) => (
          <RoomDoor x={x} broken={index === 1 || index === 5} key={`door-${x}`} />
        ))}
        {frontRooms.map((x, index) => (
          <RoomWindow x={x} boarded={index === 2 || index === 6} key={`window-${x}`} />
        ))}
        <div className="motel-2d-balcony" />
        <div className="motel-2d-pipes" />
        <div className="motel-2d-graffiti">NO VACANCY</div>
      </div>
      <SideRooms side="left" />
      <SideRooms side="right" />
      <div className="motel-2d-pool">
        <span />
      </div>
      <div className="motel-2d-fence motel-2d-fence-front" />
      <div className="motel-2d-fence motel-2d-fence-left" />
      <div className="motel-2d-fence motel-2d-fence-right" />
      <div className="motel-2d-lounger motel-2d-lounger-left" />
      <div className="motel-2d-lounger motel-2d-lounger-right" />
      <BurntCar x={28} y={82} turn={-7} />
      <BurntCar x={50} y={84} turn={4} />
      <BurntCar x={72} y={81} turn={13} />
      {trashProps.map(([className, x, y]) => (
        <span className={String(className)} style={{ left: `${x}%`, top: `${y}%` }} key={`${className}-${x}`} />
      ))}
      {isStalkerVisible && <div className="motel-2d-stalker-shadow" />}
      <div className="motel-2d-fog" />
    </div>
  );
}
