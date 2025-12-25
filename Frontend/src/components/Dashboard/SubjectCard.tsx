import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

type SubjectCardProps = {
  subjectId: string;          // ✅ new
  title: string;
  focusLink?: string;         // default "/focus"
};

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subjectId,
  title,
  focusLink = "/focus",
}) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotX = useTransform(my, [-40, 40], [6, -6]);
  const rotY = useTransform(mx, [-40, 40], [-6, 6]);
  const sRotX = useSpring(rotX, { stiffness: 240, damping: 20 });
  const sRotY = useSpring(rotY, { stiffness: 240, damping: 20 });

  const gx = useTransform(mx, [-80, 80], ["30%", "70%"]);
  const gy = useTransform(my, [-80, 80], ["20%", "80%"]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: "preserve-3d" }}
      className="
        group relative overflow-hidden rounded-2xl
        border border-zinc-200 bg-white
        shadow-sm transition-shadow
        hover:shadow-lg
      "
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-24 opacity-0 blur-2xl group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle at var(--x) var(--y), rgba(59,130,246,0.22), transparent 55%)",
          // @ts-ignore
          "--x": gx,
          // @ts-ignore
          "--y": gy,
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 opacity-0 group-hover:opacity-100"
        initial={{ x: "-45%" }}
        whileHover={{ x: "45%" }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]" />
      </motion.div>

      <div className="absolute left-0 top-0 h-full w-[3px] bg-zinc-200 group-hover:bg-blue-500 transition-colors duration-300" />

      <div className="relative p-4" style={{ transform: "translateZ(12px)" }}>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>

        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
          If you want to start studying now, click{" "}
          <span className="font-semibold text-zinc-700">Start Focus</span>.
        </p>

        <div className="mt-3">
          <Link
            to={focusLink}
            state={{ subjectId }}   // ✅ THIS
            className="
              inline-flex items-center gap-2
              text-xs font-semibold text-blue-600
              hover:text-blue-700 transition-colors
            "
          >
            Start Focus →
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
