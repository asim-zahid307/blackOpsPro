import {SEVERITY_LABELS} from '@/types/ticket';

interface Props {
    severity: number;
}

const SEVERITY_STYLES: Record<number, string> = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-gray-100 text-gray-600',
};

export default function SeverityBadge({severity}: Props) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[severity] ?? 'bg-gray-100 text-gray-600'}`}>
            S{severity} — {SEVERITY_LABELS[severity] ?? 'Unknown'}
        </span>
    );
}