# Shannon Entropy for Secret Detection

EnvShield identifies high-entropy random strings likely to be API keys or cryptographic private tokens:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Strings with $H(X) \ge 4.5$ and length $\ge 20$ characters are flagged as potential unmasked credentials.
