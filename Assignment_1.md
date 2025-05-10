# Lab 1 – Assignment 1: The Test Design Technique

*Team members: Adam X & Daniel Y*  

**Work distribution**

| Task | Team member(s) |
| ---- | -------------- |
| Q1 – Test Design Technique | Adam (steps & structure), Daniel (explanation & justification) |
| Q2 – BVA & EP | Adam (EP explanation & application), Daniel (BVA explanation & comparison) |
| Q3 – Designing test cases | Joint discussion; Adam (conditions & combinations table), Daniel (expected-outcome table & documentation) |

---

## 1  Test Design Technique

### 1.1  Four-Step Test Design Technique

1. **Identify action & correct result** – Describe *what is done* and *what should happen* if everything works.  
2. **Identify conditions that influence the result** – List every factor that can change the outcome.  
3. **Combine the conditions** – Create all logically valid combinations of condition values.  
4. **Define the expected result for each combination** – Decide, from the requirements or rules, what the system must do in every combination.

### 1.2  Why this technique is useful

Following these four steps forces *completeness* (every condition is considered), *traceability* (each test can be traced to a requirement), and *repeatability* (the same structured process can be reused across features).

### 1.3  Justification for choosing the Four-Step TDT

The technique  

* scales from unit level to end-to-end scenarios,  
* exposes hidden equivalence classes early (when we enumerate conditions),  
* dovetails with other design techniques such as BVA and EP, and  
* produces a combinations table that can be converted directly into executable test cases.

---

## 2  Boundary Value Analysis (BVA) and Equivalence Partitioning (EP)

### 2.1  Explanation

**Equivalence Partitioning (EP)** divides the input space into partitions that the program should treat identically; testing one representative from each partition gives confidence for the entire set.

**Boundary Value Analysis (BVA)** focuses on the exact edges of those partitions (minimum, maximum, and the values just below/above) where faults often cluster.

### 2.2  Comparison of usability

| Aspect | BVA | EP |
|--------|-----|----|
| Focus | Boundary values | Representative value per partition |
| Test effort | More cases but higher fault-detection | Fewer cases, faster |
| Strength | Excellent for numeric limits | Excellent for broad functional ranges |
| Weakness | Less helpful for non-numeric data | Alone may miss boundary faults |

EP keeps the suite small; BVA complements it with edge precision. Together they balance coverage and effort.

### 2.3  Application to the *age-validity* method

**Equivalence partitions**

| Partition | Range | Expected result | Representative |
|-----------|-------|-----------------|----------------|
| Impossible (below range) | *age* < 0 | “Impossible age” | –5 |
| Under-age | 0 ≤ *age* < 18 | “Underage” | 5 |
| Valid | 18 ≤ *age* ≤ 120 | “Valid age” | 30 |
| Impossible (above range) | *age* > 120 | “Impossible age” | 150 |

**Boundary values**

| Boundary | Test values |
|----------|-------------|
| 0 | –1, 0, 1 |
| 18 | 17, 18, 19 |
| 120 | 119, 120, 121 |

---

## 3  Designing Test Cases – *Building-Door Scenario*

### 3.1  Conditions and actions

*Conditions*  
1. **Location** {Outside, Inside}  
2. **Card validity** {Valid, Invalid/None} (Outside only)  
3. **Card hold duration** { < 2 s, ≥ 2 s } (Valid card only)  
4. **Porter unlock** {Enabled, Not enabled}

*Actions* – *Door opens* | *Door remains locked*

### 3.2  Table A – All valid combinations of conditions

| # | Location | Card validity | Hold duration | Porter unlock |
|---|----------|---------------|---------------|---------------|
| 1 | Outside | Valid | ≥ 2 s | Not enabled |
| 2 | Outside | Valid | < 2 s | Not enabled |
| 3 | Outside | Valid | < 2 s | Enabled |
| 4 | Outside | Invalid/None | – | Not enabled |
| 5 | Outside | Invalid/None | – | Enabled |
| 6 | Inside | – | – | – |

*A combination is still valid even if several yield the same outcome; they are kept separate to satisfy the feedback.*

### 3.3  Table B – Expected outcome for each combination

| # | Expected outcome | Rule rationale |
|---|------------------|----------------|
| 1 | Door opens | Valid card + ≥ 2 s satisfies entry rule |
| 2 | **Door locked** | Card held too short |
| 3 | Door opens | Porter override supersedes hold-time failure |
| 4 | **Door locked** | No valid authentication |
| 5 | Door opens | Porter override |
| 6 | Door opens | Door always opens from inside |

### 3.4  Applying BVA & EP to *hold-time* (optional refinement)

| Technique | Test values |
|-----------|-------------|
| EP | {< 2 s}, {≥ 2 s} ⇒ representative 1.5 s, 2 s |
| BVA | 1.9 s, 2.0 s, 2.1 s |

---

## 4  References

1. Myers, G. J. *The Art of Software Testing* (1979).  
2. Beizer, B. *Software Testing Techniques* (1995).  
3. Course material PA1417 LP4 2024/25.  

---
