<!--
title: 题解：CF87E Mogohu-Rea Idol
date: 2026-04-14
tags: [编程,凸包,闵科夫斯基和]
summary: 此题目等价于求一个点是否在三个凸多边形的闵科夫斯基和的内部……
-->

三角形的三个顶点分别为 $A(x_1,y_1),B(x_2,y_2),C(x_2,y_2)$。

重心的定义：
> 三角形的三条中线交于一点，该交点称作三角形的重心。

所以重心为 $P=\frac{A+B+C}{3}$，因此题目等价于求一个点是否在三个凸多边形的闵科夫斯基和的内部。

可能有精度误差，所以可以把询问的点坐标乘 $3$。

:::info[代码]
```cpp line-numbers lines=149-173
#include<bits/stdc++.h>
typedef int int32;
#define int long long
using namespace std;
const int N = 5e4 + 5;
namespace math
{
#include<cmath>
	using namespace std;
	struct cc {
		int first, second;
		int& x()
		{
			return first;
		}
		int& y()
		{
			return second;
		}
		bool operator==(const cc& u) const
		{
			return first == u.first && second == u.second;
		}
		bool operator<(const cc& u) const
		{
			if (first != u.first)
				return first < u.first;
			return second < u.second;
		}
	};  // CartesianPoint: (x, y)
	cc operator+(const cc& v1, const cc& v2)
	{
		return { v1.first + v2.first, v1.second + v2.second };
	}
	cc operator-(const cc& v1, const cc& v2)
	{
		return { v1.first - v2.first, v1.second - v2.second };
	}
	int cross(const cc& v1, const cc& v2)
	{
		return v1.first * v2.second - v1.second * v2.first;
	}
	int dis(const cc& x, const cc& y)
	{
		cc tmp = x - y;
		return tmp.first * tmp.first + tmp.second * tmp.second;
	}
	istream& operator>>(istream& in, cc& x)
	{
		return in >> x.first >> x.second;
	}
	vector<cc>convexHull(vector<cc>a)
	{
		vector<cc>b;
		int n = a.size();
		for (int i = 1; i < n; i++)
			if (a[i].second > a[0].second || (a[i].second == a[0].second &&
				a[i].first > a[0].first))
				swap(a[0], a[i]);
		auto cmp = [&](const cc& x, const cc& y)
			{
				int tmp = cross(x - a[0], y - a[0]);
				if (abs(tmp))
					return tmp > 0;
				return dis(x, a[0]) < dis(y, a[0]);
			};
		sort(a.begin() + 1, a.end(), cmp);
		b = { a[0], a[1] };
		for (int i = 2; i < n; i++)
		{
			while (b.size() > 1 && cross(b.back() - b[b.size() - 2],
				a[i] - b.back()) <= 0)
				b.pop_back();
			b.push_back(a[i]);
		}
		return b;
	}
	template<typename T, typename _T>
	inline vector<T>converToVector(_T l, _T r)
	{
		vector<T> a;
		while (l < r)
		{
			a.push_back(*l);
			l++;
		}
		return a;
	}
	vector<cc>minkowski(const vector<cc>& a, const vector<cc>& b)
	{
		vector<cc>c, d, e;
		for (int i = 1; i < a.size(); i++)
			c.push_back(a[i] - a[i - 1]);
		c.push_back(a[0] - a.back());
		for (int i = 1; i < b.size(); i++)
			d.push_back(b[i] - b[i - 1]);
		d.push_back(b[0] - b.back());
		reverse(c.begin(), c.end());
		reverse(d.begin(), d.end());
		e.push_back(a[0] + b[0]);
		while (!c.empty() && !d.empty())
			if (cross(c.back(), d.back()) >= 0)
			{
				e.push_back(e.back() + c.back());
				c.pop_back();
			}
			else
			{
				e.push_back(e.back() + d.back());
				d.pop_back();
			}
		while (!c.empty())
		{
			e.push_back(e.back() + c.back());
			c.pop_back();
		}
		while (!d.empty())
		{
			e.push_back(e.back() + d.back());
			d.pop_back();
		}
		return e;
	}
	bool in(cc a, const vector<cc>& b)
	{
		if (cross(b.back() - b[0], a - b[0]) > 0 ||
			cross(a - b[0], b[1] - b[0]) > 0)
			return false;
		int l = 1, r = b.size() - 1;
		while (l + 1 < r)
		{
			int mid = (l + r) >> 1;
			if (cross(b[mid] - b[0], a - b[0]) > 0)
				l = mid;
			else
				r = mid;
			cerr << '@' << l << ' ' << r << '\n';
		}
		return cross(b[r] - b[l], a - b[l]) >= 0;
	}
}
using namespace math;
int n, m, k, q;
cc a[N], b[N], c[N];
signed main()
{
	ios::sync_with_stdio(0);
	cin.tie(0), cout.tie(0);
	cin >> n;
	for (int i = 1; i <= n; i++)
		cin >> a[i];
	cin >> m;
	for (int i = 1; i <= m; i++)
		cin >> b[i];
	cin >> k;
	for (int i = 1; i <= k; i++)
		cin >> c[i];
	vector<cc> d = convexHull(converToVector<cc>(a + 1, a + 1 + n)),
		e = convexHull(converToVector<cc>(b + 1, b + 1 + m)),
		f = convexHull(converToVector<cc>(c + 1, c + 1 + k));
	d = convexHull(minkowski(minkowski(d, e), f));
	for (auto& x : d)
		cerr << '#' << x.first << ' ' << x.second << '\n';
	cin >> q;
	while (q--)
	{
		cc x;
		cin >> x;
		x.x() *= 3;
		x.y() *= 3;
		cerr << x.first << ' ' << x.second << '\n';
		cout << (in(x, d) ? "YES" : "NO") << '\n';
	}
	return 0;
}
```
:::