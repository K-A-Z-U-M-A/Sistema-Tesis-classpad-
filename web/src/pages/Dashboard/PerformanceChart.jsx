import React from "react";
import { Box, Typography } from "@mui/material";
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";

const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, color: "#98979D" }}>
        <Typography variant="body2" color="text.secondary">No hay datos disponibles aun</Typography>
      </Box>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 80 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E0EC" vertical={false} />
        <XAxis
          dataKey="name" angle={-40} textAnchor="end" height={90}
          tick={{ fontSize: 11, fill: "#49454F" }} interval={0} tickLine={false} axisLine={false}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#49454F" }} tickLine={false} axisLine={false} />
        <RechartsTooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #CAC4D0", boxShadow: "0px 4px 8px 3px rgba(0,0,0,0.15)", fontSize: 13 }}
          formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="averageGrade"    name="Promedio"      fill="#6750A4" radius={[6, 6, 0, 0]} maxBarSize={24} />
        <Bar dataKey="attendanceRate"  name="Asistencia"    fill="#146C2E" radius={[6, 6, 0, 0]} maxBarSize={24} />
        <Bar dataKey="participationRate" name="Participación" fill="#7D5260" radius={[6, 6, 0, 0]} maxBarSize={24} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
