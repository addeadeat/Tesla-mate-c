import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel state-panel">
      <h1>没有找到这个页面</h1>
      <p>从车辆状态重新开始。</p>
      <Link className="button" href="/">
        返回首页
      </Link>
    </section>
  );
}
