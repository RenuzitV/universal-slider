import React, { useState } from "react";
import styles from "../styles/solar-system.module.css";
import { SolarBodyConfig } from "./solarBodies";

export default interface PointOfInterest {
  id: string;
  date: Date;
  title: string;
  description: string;
  imageUrl: string;
}

const isDev = process.env.NODE_ENV == "development";

export function CreatePOI({ earth, poi }: { earth: SolarBodyConfig | undefined, poi: PointOfInterest }) {
  const [showing, setShowing] = useState(false);
  let x: number | null = null
  let y: number | null = null

  for (let point of (earth?.orbitTrajectory!)) {
    point.date = new Date(point.date)
    // console.log(point.date)
    if (point.date?.getDate != null && point.date?.getDate() == poi.date.getDate() && point.date?.getMonth() == poi.date.getMonth()) {
      x = point.x
      y = point.y
      break
    }
  }

  if (!x || !y) {
    console.warn("could not find date for ", poi)
  }

  return (x && y &&
    <g
      key={poi.id}
      onMouseEnter={() => setShowing(true)}
      onMouseLeave={() => {
        if (isDev){
          return
        }

        setShowing(false)
      }}
    >
      <circle
        cx={x!}
        cy={y!}
        r={25}
        fill="rgba(230, 122, 255, 1)"
        strokeWidth={5}
        className={styles.poi}
      />
      {showing && (
        <foreignObject
          x={x!}
          y={y! - 200} // anchor point, offset 200px upward
          width={1}
          height={1}
          style={{ overflow: "visible", pointerEvents: "none" }} // ignore pointer on container
        >
          <div className={styles.popup + " " + styles.popupAnchor}>
            <div className={styles.popupTitle}>{poi.title}</div>
            <div className={styles.popupDate}>{poi.date.toDateString()}</div>
            <div className={styles.popupDesc}>{poi.description}</div>
          </div>
        </foreignObject>

      )}
    </g>
  );
}

// Sample hardcoded POIs
export const defaultPOIs: PointOfInterest[] = [
  {
    id: "poi1",
    date: new Date("2025-01-20"),
    title: "First Date",
    description: "Our magical first time together.",
    imageUrl: "/images/poi1.jpg",
  },
  {
    id: "poi2",
    date: new Date("2025-11-07"),
    title: "The Beach Day",
    description: "A sunny day by the sea.",
    imageUrl: "/images/poi2.jpg",
  },
  {
    id: "poi3",
    date: new Date("2025-05-18"),
    title: "New Year Together",
    description: "Ringing in the new year.",
    imageUrl: "/images/poi3.jpg",
  },
  {
    id: "poi4",
    date: new Date(Date.now()),
    title: "best day ever!!!",
    description: "Ringing in the new year.",
    imageUrl: "/images/poi3.jpg",
  },
];
