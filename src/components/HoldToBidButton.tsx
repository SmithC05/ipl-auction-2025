import { useHaptic } from '../hooks/useHaptic';

interface HoldToBidButtonProps {
    amount: number;
    label: string;
    disabled: boolean;
    onBid: (amount: number) => void;
}

const HoldToBidButton: React.FC<HoldToBidButtonProps> = ({ amount, label, disabled, onBid }) => {
    const { trigger } = useHaptic();


    return (
        <button
            className={`relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''} primary`}
            style={{ padding: '16px', fontSize: '1.1rem', touchAction: 'manipulation', userSelect: 'none' }}
            onClick={() => {
                if (!disabled) {
                    trigger('medium');
                    console.log('Click triggered onBid');
                    onBid(amount);
                }
            }}
            disabled={disabled}
        >
            <span className="relative z-10">{label}</span>
        </button>
    );
};

export default HoldToBidButton;
