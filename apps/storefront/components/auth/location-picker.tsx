"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, X } from "lucide-react";

interface LocationData {
    street: string;
    province: string;
    latitude?: number;
    longitude?: number;
}

interface LocationPickerProps {
    onLocationDetected: (location: LocationData) => void;
    disabled?: boolean;
}

// OpenStreetMap Nominatim API for reverse geocoding (free)
async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
            {
                headers: {
                    'User-Agent': 'ApexPlatform/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        return {
            street: data.address?.road || data.address?.suburb || data.display_name?.split(',')[0] || '',
            province: data.address?.state || data.address?.city || data.address?.county || '',
            latitude: lat,
            longitude: lng,
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            street: '',
            province: '',
            latitude: lat,
            longitude: lng,
        };
    }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        });
    });
}

export function LocationPicker({ onLocationDetected, disabled }: LocationPickerProps) {
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDetectLocation = useCallback(async () => {
        setDetecting(true);
        setError(null);

        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            const location = await reverseGeocode(latitude, longitude);
            onLocationDetected(location);

        } catch (err) {
            if (err instanceof GeolocationPositionError) {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('تم رفض إذن الموقع');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('الموقع غير متاح');
                        break;
                    case err.TIMEOUT:
                        setError('انتهت المهلة');
                        break;
                    default:
                        setError('خطأ في تحديد الموقع');
                }
            } else {
                setError('خطأ في تحديد الموقع');
            }
        } finally {
            setDetecting(false);
        }
    }, [onLocationDetected]);

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                onClick={handleDetectLocation}
                disabled={disabled || detecting}
                className="w-full"
            >
                {detecting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري تحديد موقعك...
                    </>
                ) : (
                    <>
                        <MapPin className="mr-2 h-4 w-4" />
                        تحديد موقعي تلقائياً
                    </>
                )}
            </Button>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                    <X className="h-4 w-4" />
                    <span>{error} - يمكنك إدخال العنوان يدوياً</span>
                </div>
            )}
        </div>
    );
}
