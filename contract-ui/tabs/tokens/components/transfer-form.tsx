import {
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  FormControl,
  Input,
  Stack,
  useModalContext,
} from "@chakra-ui/react";
import { useTokenDecimals, useTransferToken } from "@thirdweb-dev/react";
import type { Erc20 } from "@thirdweb-dev/sdk";
import { TransactionButton } from "components/buttons/TransactionButton";
import { constants } from "ethers";
import { useTrack } from "hooks/analytics/useTrack";
import { useTxNotifications } from "hooks/useTxNotifications";
import { useForm } from "react-hook-form";
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
} from "tw-components";

const TRANSFER_FORM_ID = "token-transfer-form";
interface TokenTransferFormProps {
  contract?: Erc20;
}

export const TokenTransferForm: React.FC<TokenTransferFormProps> = ({
  contract,
}) => {
  const trackEvent = useTrack();
  const transfer = useTransferToken(contract);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: { amount: "0", to: "" } });
  const modalContext = useModalContext();

  const { onSuccess, onError } = useTxNotifications(
    "Successfully transferred tokens",
    "Failed to transfer tokens",
  );

  const decimals = useTokenDecimals(contract);

  return (
    <>
      <DrawerHeader>
        <Heading>Transfer tokens</Heading>
      </DrawerHeader>
      <DrawerBody>
        <Stack gap={3} as="form">
          <Stack spacing={6} w="100%" direction={{ base: "column", md: "row" }}>
            <FormControl isRequired isInvalid={!!errors.to}>
              <FormLabel>To Address</FormLabel>
              <Input placeholder={constants.AddressZero} {...register("to")} />
              <FormHelperText>Enter the address to transfer to.</FormHelperText>
              <FormErrorMessage>{errors.to?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.amount}>
              <FormLabel>Amount</FormLabel>
              <Input
                type="text"
                pattern={`^\\d+(\\.\\d{1,${decimals?.data || 18}})?$`}
                {...register("amount")}
              />
              <FormHelperText>
                How many would you like to transfer?
              </FormHelperText>
              <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
            </FormControl>
          </Stack>
        </Stack>
      </DrawerBody>
      <DrawerFooter>
        <TransactionButton
          transactionCount={1}
          form={TRANSFER_FORM_ID}
          isLoading={transfer.isLoading}
          type="submit"
          colorScheme="primary"
          isDisabled={!isDirty}
          onClick={handleSubmit((d) => {
            trackEvent({
              category: "token",
              action: "transfer",
              label: "attempt",
            });
            transfer.mutate(
              { amount: d.amount, to: d.to },
              {
                onSuccess: () => {
                  trackEvent({
                    category: "token",
                    action: "transfer",
                    label: "success",
                  });
                  onSuccess();
                  modalContext.onClose();
                },
                onError: (error) => {
                  trackEvent({
                    category: "token",
                    action: "transfer",
                    label: "error",
                    error,
                  });
                  onError(error);
                },
              },
            );
          })}
        >
          Transfer Tokens
        </TransactionButton>
      </DrawerFooter>
    </>
  );
};
