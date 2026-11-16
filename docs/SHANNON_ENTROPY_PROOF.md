# Mathematical Foundation of Shannon Entropy in Secret Detection

Shannon entropy measures information density and randomness:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Natural language and standard configuration strings exhibit $H(X) < 3.8$, while cryptographic keys (AES, RSA, API tokens) exhibit $H(X) \ge 4.5$.
