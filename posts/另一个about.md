<!--
title: 另一个about
date: 2026-04-14
tags: [关于,杂谈,言论]
-->

# 另一个about

::: info[==快去点个 star！==]{open}

采用 GNU通用公共许可证 (GPL) 第3版 授权。详见 [LICENSE.md](https://github.com/wbw121124/wbw121124blog/blob/master/LICENSE.md) 文件。

~~light mode 让我眼睛瞎了~~

这是一个基于 Vue 3 和 Vite 构建的博客网站，使用作者自己编写的博客框架。

:::

[![Optimized Blog CI/CD](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages.yml/badge.svg)](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages.yml)[![pages-build-deployment](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/wbw121124/wbw121124blog/actions/workflows/pages/pages-build-deployment)

hljs：
```cpp {157-188} [hljs]
#include<bits/stdc++.h>
typedef int int32;
#define int long long
using namespace std;
const int N = 1e5 + 5;
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
	};// CartesianPoint: (x, y)
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
			if (a[i].second > a[0].second ||
				(a[i].second == a[0].second &&
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
		b = { a[0],a[1] };
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
		vector<T>a;
		while (l < r)
		{
			a.push_back(*l);
			l++;
		}
		return a;
	}
	vector<cc>minkowski(const vector<cc>& a, const vector<cc>& b)
	{
		if (a.empty())
			return b;
		if (b.empty())
			return a;
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
		if (cross(a, b[1]) > 0 || cross(b.back(), a) > 0)
			return false;
		auto cmp = [&](const cc& x, const cc& y)
			{
				int tmp = cross(x, y);
				if (abs(tmp))
					return tmp > 0;
				return dis(x, cc{ 0,0 }) < dis(y, cc{ 0,0 });
			};
		int tmp = lower_bound(b.begin() + 1,
			b.end(), a, cmp) - b.begin() - 1;
		return cross(a - b[tmp],
			b[tmp % (b.size() - 1) + 1] - b[tmp]) <= 0;
	}
}
using namespace math;
int n, k, ans;
vector<cc>a[N];
struct node {
	int id;
	bool operator<(const node& u) const
	{
		return a[id].size() > a[u.id].size();
	}
};
priority_queue<node>q;
signed main()
{
	ios::sync_with_stdio(0);
	cin.tie(0), cout.tie(0);
	cin >> n;
	for (int i = 1; i <= n; i++)
	{
		cin >> k;
		for (int j = 1; j <= k; j++)
		{
			cc x;
			cin >> x;
			a[i].push_back(x);
		}
		a[i] = convexHull(a[i]);
		q.push({ i });
	}
	for (int i = 1; i < n; i++)
	{
		node x = q.top();
		q.pop();
		node y = q.top();
		q.pop();
		a[y.id] = convexHull(minkowski(a[x.id], a[y.id]));
		a[x.id].clear();
		q.push(y);
	}
	for (auto& x : a[q.top().id])
		ans = max(ans, x.first * x.first + x.second * x.second);
	cout << ans;
	return 0;
}
```

shiki：
```cpp {157-188} [shiki]
#include<bits/stdc++.h>
typedef int int32;
#define int long long
using namespace std;
const int N = 1e5 + 5;
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
	};// CartesianPoint: (x, y)
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
			if (a[i].second > a[0].second ||
				(a[i].second == a[0].second &&
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
		b = { a[0],a[1] };
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
		vector<T>a;
		while (l < r)
		{
			a.push_back(*l);
			l++;
		}
		return a;
	}
	vector<cc>minkowski(const vector<cc>& a, const vector<cc>& b)
	{
		if (a.empty())
			return b;
		if (b.empty())
			return a;
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
		if (cross(a, b[1]) > 0 || cross(b.back(), a) > 0)
			return false;
		auto cmp = [&](const cc& x, const cc& y)
			{
				int tmp = cross(x, y);
				if (abs(tmp))
					return tmp > 0;
				return dis(x, cc{ 0,0 }) < dis(y, cc{ 0,0 });
			};
		int tmp = lower_bound(b.begin() + 1,
			b.end(), a, cmp) - b.begin() - 1;
		return cross(a - b[tmp],
			b[tmp % (b.size() - 1) + 1] - b[tmp]) <= 0;
	}
}
using namespace math;
int n, k, ans;
vector<cc>a[N];
struct node {
	int id;
	bool operator<(const node& u) const
	{
		return a[id].size() > a[u.id].size();
	}
};
priority_queue<node>q;
signed main()
{
	ios::sync_with_stdio(0);
	cin.tie(0), cout.tie(0);
	cin >> n;
	for (int i = 1; i <= n; i++)
	{
		cin >> k;
		for (int j = 1; j <= k; j++)
		{
			cc x;
			cin >> x;
			a[i].push_back(x);
		}
		a[i] = convexHull(a[i]);
		q.push({ i });
	}
	for (int i = 1; i < n; i++)
	{
		node x = q.top();
		q.pop();
		node y = q.top();
		q.pop();
		a[y.id] = convexHull(minkowski(a[x.id], a[y.id]));
		a[x.id].clear();
		q.push(y);
	}
	for (auto& x : a[q.top().id])
		ans = max(ans, x.first * x.first + x.second * x.second);
	cout << ans;
	return 0;
}
```

| ${\Huge\color{red}\text{\textcircled{}}{\huge\hspace{-.71cm}\not}\footnotesize\overset{\small\hspace{-.1cm}\color{black}Fake}{\color{transparent}.}}\newline\color{black}\footnotesize\text{Fake has been forbidden.}$ |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
