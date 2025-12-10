import { GeoPoint, UTMCoordinates } from "../types";

// WGS84 Constants
const K0 = 0.9996;
const E = 0.00669438;
const E_P2 = E / (1 - E);
const SQRT_E = Math.sqrt(1 - E);
const _E = (1 - SQRT_E) / (1 + SQRT_E);
const M1 = 1 - E / 4 - 3 * E * E / 64 - 5 * E * E * E / 256;
const M2 = 3 * E / 8 + 3 * E * E / 32 + 45 * E * E * E / 1024;
const M3 = 15 * E * E / 256 + 45 * E * E * E / 1024;
const M4 = 35 * E * E * E / 3072;
const R = 6378137; // Radius of Earth

/**
 * Converts Latitude/Longitude to UTM
 * Note: Simplified implementation for standard WGS84 usage.
 */
export const toUTM = (lat: number, lon: number): UTMCoordinates => {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const zoneCM = 6 * zone - 183;
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  const zoneCMRad = zoneCM * (Math.PI / 180);

  const n = R / Math.sqrt(1 - E * Math.sin(latRad) * Math.sin(latRad));
  const t = Math.tan(latRad) * Math.tan(latRad);
  const c = E_P2 * Math.cos(latRad) * Math.cos(latRad);
  const a = Math.cos(latRad) * (lonRad - zoneCMRad);

  const m = R * (M1 * latRad - M2 * Math.sin(2 * latRad) + M3 * Math.sin(4 * latRad) - M4 * Math.sin(6 * latRad));

  let easting = K0 * n * (a + (1 - t + c) * a * a * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 * E_P2) * a * a * a * a * a / 120) + 500000;
  let northing = K0 * (m + n * Math.tan(latRad) * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * a * a * a * a / 24 + (61 - 58 * t + t * t + 600 * c - 330 * E_P2) * a * a * a * a * a * a / 720));

  if (lat < 0) {
    northing += 10000000;
  }

  // Determine Band (approximate)
  const bands = "CDEFGHJKLMNPQRSTUVWXX";
  const bandIndex = Math.floor(lat / 8 + 10);
  const band = bands[bandIndex] || 'X';

  return {
    easting: Math.round(easting * 100) / 100,
    northing: Math.round(northing * 100) / 100,
    zone,
    band
  };
};

export const generateKML = (points: GeoPoint[]): string => {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Levantamiento GeoSmart</name>
    <description>Puntos capturados con GeoSmart Mapper</description>`;

  const styles = `
    <Style id="pointStyle">
      <IconStyle>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1.0</scale>
      </LabelStyle>
    </Style>`;

  const placemarks = points.map(p => `
    <Placemark>
      <name>${escapeXml(p.name)}</name>
      <description>
        <![CDATA[
          <b>Tipo:</b> ${p.type}<br/>
          <b>Características:</b> ${p.characteristics}<br/>
          <b>Observaciones:</b> ${p.observations}<br/>
          <b>UTM:</b> Zone ${p.utm.zone}${p.utm.band} E:${p.utm.easting} N:${p.utm.northing}<br/>
          <b>Fecha:</b> ${new Date(p.timestamp).toLocaleString()}
        ]]>
      </description>
      <styleUrl>#pointStyle</styleUrl>
      <Point>
        <coordinates>${p.coords.longitude},${p.coords.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('');

  const footer = `
  </Document>
</kml>`;

  return header + styles + placemarks + footer;
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};