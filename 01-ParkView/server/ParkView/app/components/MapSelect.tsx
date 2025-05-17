"use client";

import React, { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";

interface MapSelectProps {
    onSelect: (lng: number, lat: number) => void;
    defaultLocation?: { lng: number; lat: number };
}

export default function MapSelect({ onSelect, defaultLocation }: MapSelectProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<AMap.Map | null>(null);
    const marker = useRef<AMap.Marker | null>(null);

    useEffect(() => {
        AMapLoader.load({
            key: "1250891f059d22237c930269df2b0633", // 替换为你的高德API Key
            version: "1.4.15",
        }).then((AMap) => {
            mapInstance.current = new AMap.Map(mapContainer.current!, {
                zoom: 14,
                center: defaultLocation ? [defaultLocation.lng, defaultLocation.lat] : [116.397428, 39.90923],
                lang: "en",
            });

            marker.current = new AMap.Marker({
                position: defaultLocation ? [defaultLocation.lng, defaultLocation.lat] : [116.397428, 39.90923],
                draggable: true, // ✅ 允许拖动
                cursor: "move",
            });

            mapInstance.current!.add(marker.current!);

            // 📌 拖拽结束时，更新坐标
            marker.current!.on("dragend", (e: AMap.MapsEvent<'dragend', MouseEvent>) => {
                const lng = e.lnglat.getLng();
                const lat = e.lnglat.getLat();
                marker.current?.setPosition([lng, lat]);
                onSelect(lng, lat);
            });

        }).catch(console.error);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.destroy();
                mapInstance.current = null;
            }
        };
    }, [onSelect, defaultLocation]);

    return <div ref={mapContainer} className="w-full h-full" />;
}
