import React from 'react';
import { Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';

const BatteryGauge = ({ level }) => {
    let color;
    let Icon = Battery;

    if (level < 20) {
        color = 'var(--color-error)';
        Icon = BatteryWarning;
    } else if (level < 50) {
        color = 'var(--color-warning)';
    } else {
        color = 'var(--color-success)';
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: color }}>
            <div style={{ position: 'relative' }}>
                <Icon size={18} />
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '2px',
                    height: '10px',
                    width: `${Math.max(0, (level / 100) * 12)}px`,
                    background: 'currentColor',
                    borderRadius: '1px',
                    opacity: 0.6
                }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{Math.round(level)}%</span>
        </div>
    );
};

export default BatteryGauge;
