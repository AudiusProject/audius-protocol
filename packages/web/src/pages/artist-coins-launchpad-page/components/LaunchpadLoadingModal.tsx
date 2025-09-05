export const LaunchpadLoadingModal = () => {
  return (
    <Modal isOpen={isModalOpen} onClose={() => {}}>
      <ModalContent>
        <Text>Launching your coin...</Text>
      </ModalContent>
    </Modal>
  )
}