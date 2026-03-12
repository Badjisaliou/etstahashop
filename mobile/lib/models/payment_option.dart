class PaymentOption {
  const PaymentOption({
    required this.label,
    required this.accountName,
    required this.accountNumber,
    required this.instructions,
  });

  final String label;
  final String accountName;
  final String accountNumber;
  final String instructions;

  factory PaymentOption.fromJson(Map<String, dynamic> json) {
    return PaymentOption(
      label: json['label'] as String? ?? '',
      accountName: json['account_name'] as String? ?? '',
      accountNumber: json['account_number'] as String? ?? '',
      instructions: json['instructions'] as String? ?? '',
    );
  }
}
