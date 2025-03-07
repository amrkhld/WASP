import React, { useState, useCallback } from "react";

interface PasswordModalProps {
  onSubmit: (password: string) => void;
  onCancel: () => void;
  roomName: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  onSubmit,
  onCancel,
  roomName,
}) => {
  const [password, setPassword] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 300); 
  }, [onCancel]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsClosing(true);
      setTimeout(() => {
        onSubmit(password);
      }, 300);
    },
    [onSubmit, password]
  );

  return (
    <div className={`password-modal-overlay ${isClosing ? "closing" : ""}`}>
      <div className={`password-modal ${isClosing ? "closing" : ""}`}>
        <div className="password-modal-title" style={{ display: "flex" }}>
          <h3 className="password-modal-title1">SECURED NEST</h3>
          <h3 className="password-modal-title2">{roomName}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="INPUT NEST KEYCODE..."
            required
          />
          <div className="modal-buttons">
            <button type="submit">INITIATE</button>
            <button type="button" onClick={handleClose}>
              ABORT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
