interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  confirmButtonColor?: string
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = '아니오',
  onConfirm,
  onCancel,
  confirmButtonColor = 'bg-red-500 hover:bg-red-600'
}: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-[320px] rounded-lg p-6 mx-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 text-white py-2 rounded-lg font-medium ${confirmButtonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
