import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import styles from './index.less';
import ListItemComp from './ListItem';
export enum ModelStatus {
  ALL = 0,
  WAITING = 1,
  PENDING = 2,
  SUCCESS = 3,
  FAIL = 4,
  CANCEL = 5,
  WAITING_MERGING = 6, // 文档merge中
}
export type ItemStatus = Exclude<ModelStatus, ModelStatus.ALL>;

export const getStatus = (status: ItemStatus) => {
  switch (status) {
    case ModelStatus.FAIL:
      return '处理失败';
    case ModelStatus.PENDING:
      return '处理中';
    case ModelStatus.SUCCESS:
      return '处理成功';
    case ModelStatus.WAITING_MERGING:
      return '转换预处理中';
    case ModelStatus.WAITING:
      return '等待中';
    case ModelStatus.CANCEL:
      return '取消';
    default:
      return <></>;
  }
};

export type TemplateType =
  | '植物'
  | '设备'
  | '车辆'
  | '人员'
  | '建筑'
  | '道具'
  | '其它';

export interface ListItem {
  key?: string;
  name: string;
  guid: string;
  type: string;
  templateType: TemplateType;
  status: ItemStatus;
  statusInfo?: {
    queue?: number;
    progress?: number;
    error?: string;
  };
  updateDate: string;
  previewImage?: string;
  resourceCount?: string;
  size?: string;
  //appName: string
  //appId: string
}
const list: ListItem[] = [
  {
    guid: 'ee08c665be4d4ae2a4e2181e3a9e0f25',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750 (1).fbx',
    status: ModelStatus.FAIL,
    statusInfo: { error: '转换服务器不存在该转换信息' },
    updateDate: '2021-07-19 14:36:10',
    resourceCount: '0',
    size: '0',
  },
  {
    guid: 'ee08c665be4d4ae2a4e2181e3a9e0f21',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750 (1).fbx, 路灯_750 (1).fbx路灯_750 (1).fbx路灯_750 (1).fbx路灯_750 (1).fbx路灯_750 (1).fbx',
    status: ModelStatus.PENDING,
    statusInfo: { progress: 30 },
    updateDate: '2021-07-19 14:36:10',
    resourceCount: '0',
    size: '0',
  },
  {
    guid: 'ee08c665be4d4ae2a4e2181e3a9e0f22',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750 (1).fbx',
    status: ModelStatus.WAITING,
    statusInfo: { queue: 2 },
    updateDate: '2021-07-19 14:36:10',
    resourceCount: '0',
    size: '0',
  },
  {
    guid: 'ee08c665be4d4ae2a4e2181e3a9e0f23',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750 (1).fbx',
    status: ModelStatus.WAITING_MERGING,
    statusInfo: undefined,
    updateDate: '2021-07-19 14:36:10',
    resourceCount: '0',
    size: '0',
  },
  {
    guid: 'ee08c665be4d4ae2a4e2181e3a9e0f24',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750 (1).fbx',
    status: ModelStatus.CANCEL,
    statusInfo: { queue: 3 },
    updateDate: '2021-07-19 14:36:10',
    resourceCount: '0',
    size: '0',
  },
  {
    guid: 'c5c4823702334ffa9caa1042a10448f1',
    type: 'FBX',
    templateType: '植物',
    name: '路灯_750.fbx',
    status: ModelStatus.SUCCESS,
    updateDate: '2021-07-19 14:21:43',
    resourceCount: '0',
    size: '0',
    previewImage:
      'https://th.bing.com/th/id/R.b93e91c0c12f26ad833ecef9cdeed73c?rik=y5DFwQgp4vWF2w&riu=http%3a%2f%2fd.yysucai.com%2fuploads%2fallimg%2f1711%2f1-1G123193320530.png&ehk=GmirdSpFMPSZ5KmqzRpIsIAsAqagdoNRArjkYszaS%2fI%3d&risl=&pid=ImgRaw',
  },
];
const getGuid = () => {
  return Math.random().toString(36).slice(-8);
};
const getMoreData = (needNum: number) => {
  const newAry = new Array(needNum).fill(1);
  const res: ListItem[] = newAry.map(() => {
    const originLen = list.length;
    const random = Math.floor(Math.random() * originLen);
    const guid = getGuid();
    // console.log(guid)
    const item = cloneDeep(list[random]);
    item.guid = guid;
    return item;
  });
  return res;
};

const data = {
  code: 200,
  data: {
    pageNo: 1,
    pageSize: 10,
    count: 100,
    list: list,
  },
  msg: '操作成功',
};

export interface BaseListItem {
  key: string;
  name: string;
  date: string;
}

interface Props<T> {
  list: T[];
  loadMore: () => void;
  viewportHeight: number;
  virtual: boolean;
}

const scrollInfo = {
  isMouseDown: false,
  startEvent: undefined,
};

function IndexComponent<T>(props: Props<T>): JSX.Element {
  const divRef = useRef<HTMLDivElement>(document.createElement('div'));
  const scrollBarRef = useRef<HTMLDivElement>(document.createElement('div'));
  const [itemCountPerRow, setItemCountPerRow] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(500);
  const [scrollTop, setScrollTop] = useState(0);
  const [list, setList] = useState(data.data.list);
  const [loadingMore, setLoading] = useState(false);
  const [isScrollBarMouseDown, setScrollBarMouseDown] = useState(false);
  const [scrollStartEvent, setScrollEvent] = useState<MouseEvent>();
  // 1 support virtualList ~
  // 2 support custom ListItem ~
  // 3 infinite scroll ~
  const { width, height } = useWindowSize();

  const recalc = () => {
    const divDom = divRef.current;
    if (divDom) {
      const containerWidth = divDom.offsetWidth;
      const childrenCount = list.length; // 这个值可以从 接口来 加载了多少 children
      const childWidth = 168;
      const childGapMargin = 8;
      const itemWidth = childWidth + childGapMargin * 2;
      setItemWidth(itemWidth);
      const childHeight = 200;
      const rowHeight = childHeight + childGapMargin * 2;
      setRowHeight(rowHeight);
      const itemCountInPerRow = Math.floor(containerWidth / itemWidth);
      setItemCountPerRow(itemCountInPerRow);
      const rowCount = Math.ceil(childrenCount / itemCountInPerRow);
      setRowCount(rowCount);
      const contentHeight = rowCount * rowHeight; // 内容区高度  用来计算设置滚动条的位置
      setContentHeight(contentHeight);

      if (
        contentHeight > viewportHeight &&
        scrollTop > contentHeight - viewportHeight
      ) {
        setScrollTop(contentHeight - viewportHeight);
      }
      if (contentHeight < viewportHeight) {
        getMore();
        props.loadMore && props.loadMore();
      }
    }
  };
  useEffect(() => {
    recalc();
  }, [width, height]);
  useEffect(() => {
    // 视图区高度 也就是滚动条可见范围
    recalc();
    // 初次加载 完成之后
    // 判断是否需要加载更多的条件 触发条件
    // 1.最后一条数据 是否已经全显示出来了
    // 2.滚动条已经接近
  }, [divRef, list]);
  useEffect(() => {
    const onWheel = (e?: WheelEvent) => {
      // TODO: no scroll bar return false
      if (rowHeight * rowCount < viewportHeight) {
        setScrollTop(0);
        getMore();
        return false;
      }
      if (e) {
        const { deltaY } = e;
        const newScrollTop = deltaY + scrollTop;
        let newVal = Math.max(newScrollTop, 0);
        if (newScrollTop + viewportHeight + 100 >= rowHeight * rowCount) {
          getMore();
        }
        if (newScrollTop + viewportHeight >= rowHeight * rowCount) {
          newVal = rowHeight * rowCount - viewportHeight;
        }
        setScrollTop(newVal); // 设置滚动条的位置
      }
    };
    const divDom = divRef.current;
    if (divDom) {
      divDom.addEventListener('wheel', onWheel);
    }
    return () => {
      divDom.removeEventListener('wheel', onWheel);
    };
  }, [
    scrollTop,
    divRef,
    viewportHeight,
    rowHeight,
    rowCount,
    contentHeight,
    list,
  ]);
  useEffect(() => {
    const scrollStart = (e: MouseEvent) => {
      setScrollBarMouseDown(true);
      setScrollEvent(e);
    };
    const scrolling = (e: MouseEvent) => {
      if (isScrollBarMouseDown) {
        // console.log(' start e', scrollStartEvent)
        if (scrollStartEvent) {
          const { pageY } = scrollStartEvent;
          const scrollBarOffset = e.pageY - pageY;
          // 期望 offset 是 scrollBar 移动的距离
          /**
           * scrollTop / contentHeight = scrollBarTop / viewportHeight
           */
          const scrollOffset =
            (scrollBarOffset / viewportHeight) * rowHeight * rowCount;
          const newScrollTop = scrollTop + scrollOffset;
          let newVal = Math.max(newScrollTop, 0);
          if (newScrollTop + viewportHeight >= rowHeight * rowCount) {
            newVal = rowHeight * rowCount - viewportHeight;
          }
          if (newScrollTop + viewportHeight + 100 >= rowHeight * rowCount) {
            getMore();
          }
          setScrollTop(newVal);
        }
      }
    };
    const scrollEnd = (e: MouseEvent) => {
      // console.log(' mouse end ', e)
      setScrollBarMouseDown(false);
    };
    const scrollBarDom = scrollBarRef.current;
    if (scrollBarDom) {
      scrollBarDom.addEventListener('mousedown', scrollStart);
      document.addEventListener('mousemove', scrolling);
      document.addEventListener('mouseup', scrollEnd);
    }
    return () => {
      scrollBarDom.removeEventListener('mousedown', scrollStart);
      document.removeEventListener('mousemove', scrolling);
      document.removeEventListener('mouseup', scrollEnd);
    };
  }, [
    scrollBarRef,
    scrollStartEvent,
    isScrollBarMouseDown,
    rowHeight,
    rowCount,
  ]);
  const getColumnBy = (index: number, itemCountInPerRow: number) => {
    let res = (index + 1) % itemCountInPerRow;
    if (res === 0) {
      res = itemCountInPerRow;
    }
    return res;
  };
  const getRowNumBy = (index: number) => {
    const rowNum = Math.ceil((index + 1) / itemCountPerRow);
    return rowNum;
  };
  const getTranslateY = () => {
    const res = -scrollTop + 'px';
    return res;
  };
  const getMore = () => {
    // get more data
    if (loadingMore) return;
    setLoading(true);
    setTimeout(() => {
      const appendList = getMoreData(10);
      const newList = [...list, ...appendList];
      setList(newList);
      setLoading(false);
    }, 2000);
  };

  return (
    <div
      ref={divRef}
      className={styles.container}
      style={{
        // maxHeight: contentHeight,
        height: viewportHeight,
        // background: '#eee',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* list container */}
      <div
        style={{
          height: contentHeight,
          // background: '#eee',
          overflow: 'hidden',
          transform: 'translateY(' + getTranslateY() + ')',
          position: 'relative',
        }}
        className={styles.list_container}
      >
        {itemCountPerRow > 0 &&
          list.map((item, index) => {
            // in view port show otherwise hide
            // 需要计算 当前的这个 item 的 offsetTop 多少
            const rowNum = getRowNumBy(index);
            const columnNum = getColumnBy(index, itemCountPerRow);
            const margin = 8;
            const itemOffsetTop = (rowNum - 1) * rowHeight + margin;
            const itemOffsetLeft = itemWidth * (columnNum - 1) + margin;
            // let isShow = true
            let isShow = false;
            // 不显示的条件
            if (typeof scrollTop === 'number') {
              const isInViewport =
                itemOffsetTop + rowHeight > scrollTop &&
                itemOffsetTop < scrollTop + viewportHeight;
              isShow = isInViewport;
            }
            if (isShow) {
              return (
                <ListItemComp
                  style={{
                    left: itemOffsetLeft,
                    top: itemOffsetTop,
                  }}
                  retry={() => {}}
                  cancelTransfer={() => {}}
                  deleteItem={() => {}}
                  showDetail={() => {}}
                  key={item.guid}
                  item={item}
                />
              );
            } else {
              return null;
            }
          })}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 40,
            bottom: 0,
            background: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          加载中
        </div>
      </div>

      {rowHeight * rowCount > viewportHeight && rowCount > 0 && rowHeight > 0 && (
        <div id={'scroll_container'}>
          <div
            ref={scrollBarRef}
            id={'scroll_block'}
            style={{
              top: (scrollTop * viewportHeight) / (rowCount * rowHeight),
              height:
                (viewportHeight * viewportHeight) / (rowCount * rowHeight),
            }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default IndexComponent;
